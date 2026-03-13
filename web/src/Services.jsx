import React, { memo, useState } from 'react';
import Service from "./Service";
import { findSource } from './utils';
import { SkeletonLoader } from './SkeletonLoader';

const Services = memo(function Services(props) {
  const { capacitorClient, store, filters, handleNavigationSelect } = props
  const [services, setServices] = useState(store.getState().services);
  const [fluxState, setFluxState] = useState(store.getState().fluxState);
  store.subscribe(() => setServices(store.getState().services))
  store.subscribe(() => setFluxState(store.getState().fluxState))
  const filteredServices = filterServices(services, filters)

  // Show skeleton while /api/services is still in-flight.
  // Do NOT block on fluxState.kustomizations — that comes from a separate API
  // call (/api/fluxState) and should not delay rendering pods/services.
  if (services.length === 0) {
    return <SkeletonLoader />
  }

  // Null-safe fallbacks: fluxState may still be loading when services arrive
  const kustomizations = fluxState.kustomizations || []
  const ociRepositories = fluxState.ociRepositories || []
  const gitRepositories = fluxState.gitRepositories || []
  const buckets = fluxState.buckets || []

  return (
    <>
      {filteredServices.map((service) => {
        const helmRelease = fluxState.helmReleases?.find(hr => {
          const helmReleaseLabel = service.svc.metadata?.labels?.['helm.toolkit.fluxcd.io/name']
          return hr.metadata.name === helmReleaseLabel
        })

        const kustomization = helmRelease
         ? findHelmReleaseInventory(kustomizations, helmRelease)
         : findServiceInInventory(kustomizations, service)

        const sources = [];
        sources.push(...ociRepositories)
        sources.push(...gitRepositories)
        sources.push(...buckets)
        const source = findSource(sources, kustomization)

        return (
          <Service
            key={`${service.svc.metadata.namespace}/${service.svc.metadata.name}`}
            service={service}
            alerts={[]}
            kustomization={kustomization}
            source={source}
            helmRelease={helmRelease}
            capacitorClient={capacitorClient}
            store={store}
            handleNavigationSelect={handleNavigationSelect}
          />
        )
      })}
    </>
  )
})

export default Services;

const findServiceInInventory = (kustomizations, service) => {
  const serviceKey = `${service.svc.metadata.namespace}_${service.svc.metadata.name}__Service`

  for (const k of kustomizations) {
    if (!k.status?.inventory) {
      continue
    }

    const inInventory = k.status.inventory.entries?.find((elem) => elem.id === serviceKey)
    if (inInventory) {
      return k
    }
  }

  return undefined
}

const findHelmReleaseInventory = (kustomizations, helmRelease) => {
  const key = `${helmRelease.metadata.namespace}_${helmRelease.metadata.name}_helm.toolkit.fluxcd.io_HelmRelease`

  for (const k of kustomizations) {
    if (!k.status?.inventory) {
      continue
    }
    const inInventory = k.status.inventory.entries?.find((elem) => elem.id === key)
    if (inInventory) {
      return k
    }
  }

  return undefined
}

const filterServices = (services, filters) => {
  let filteredServices = services;
  filters.forEach(filter => {
    switch (filter.property) {
      case 'Service':
        filteredServices = filteredServices.filter(service => service.svc.metadata.name.includes(filter.value))
        break;
      case 'Namespace':
        filteredServices = filteredServices.filter(service => service.svc.metadata.namespace.includes(filter.value))
        break;
      case 'Owner':
        filteredServices = filteredServices.filter(service => service.osca && service.osca.owner.includes(filter.value))
        break;
      case 'Domain':
        filteredServices = filteredServices.filter(service => service.ingresses && service.ingresses.some(ingress => ingress.url.includes(filter.value)))
        break;
      default:
    }
  })
  return filteredServices;
}
